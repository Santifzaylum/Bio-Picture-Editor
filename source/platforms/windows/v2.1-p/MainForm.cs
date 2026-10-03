using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace BioPictureEditor {
  internal sealed class MainForm : Form {
    internal int ExitCode;
    Panel setup;
    Label title, detail, stages, note;
    ProgressBar bar;
    Button retry, logs;
    WebView2 browser;
    Installer installer;
    CancellationTokenSource cancellation=new CancellationTokenSource();
    Process service;
    JobObject job;
    string address, token;
    bool loaded, closing, closeRequested, running;
    readonly object logLock=new object();
    readonly HttpClient local=new HttpClient(new HttpClientHandler {UseProxy=false}) {Timeout=TimeSpan.FromSeconds(2)};
    internal MainForm() {
      Text="生物图片编辑器 · "+Program.Version; Icon=Program.AppIcon(); StartPosition=FormStartPosition.CenterScreen;
      ClientSize=new Size(1280,840); MinimumSize=new Size(840,620); BackColor=Color.FromArgb(237,241,247);
      SuspendLayout();Font=new Font("Microsoft YaHei UI",9f);AutoScaleDimensions=new SizeF(96f,96f);AutoScaleMode=AutoScaleMode.Dpi;
      BuildSetup();
      ResumeLayout(false);PerformAutoScale();
      var screen=Screen.FromControl(this).WorkingArea;
      if(Width>screen.Width-40)Width=screen.Width-40;if(Height>screen.Height-60)Height=screen.Height-60;
      Shown+=async(sender,args)=>await StartEditor();
      FormClosing+=OnClosing;
      FormClosed+=(sender,args)=>{cancellation.Cancel();StopOwnedService();if(browser!=null)browser.Dispose();local.Dispose();cancellation.Dispose();};
    }
    void BuildSetup() {
      setup=new Panel {Dock=DockStyle.Fill,BackColor=Color.FromArgb(244,247,252)};
      var card=new Panel {Size=new Size(680,460),BackColor=Color.White};
      setup.Controls.Add(card);
      EventHandler center=(s,e)=>{card.Left=(setup.ClientSize.Width-card.Width)/2;card.Top=(setup.ClientSize.Height-card.Height)/2;};
      setup.Resize+=center;center(null,EventArgs.Empty);
      Image logoImage;using(var stream=System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("app-icon.png"))using(var image=Image.FromStream(stream))logoImage=new Bitmap(image);
      var logo=new PictureBox {Location=new Point(38,36),Size=new Size(70,70),SizeMode=PictureBoxSizeMode.Zoom,Image=logoImage};card.Controls.Add(logo);
      card.Controls.Add(new Label {Text="生物图片编辑器",Font=new Font(Font.FontFamily,22f,FontStyle.Bold),ForeColor=Color.FromArgb(37,62,94),Location=new Point(128,38),Size=new Size(480,42)});
      card.Controls.Add(new Label {Text="本地图片编辑与标注  ·  "+Program.Version,ForeColor=Color.FromArgb(119,137,161),Location=new Point(132,85),Size=new Size(440,24)});
      title=new Label {Text="正在检查运行环境",Font=new Font(Font.FontFamily,14f,FontStyle.Bold),ForeColor=Color.FromArgb(44,78,119),Location=new Point(40,146),Size=new Size(595,34)};card.Controls.Add(title);
      detail=new Label {Text="首次使用会自动安装所需依赖，完成后进入编辑界面。",ForeColor=Color.FromArgb(102,119,143),Location=new Point(42,190),Size=new Size(590,48)};card.Controls.Add(detail);
      bar=new ProgressBar {Location=new Point(42,250),Size=new Size(596,10),Minimum=0,Maximum=100,Style=ProgressBarStyle.Continuous};card.Controls.Add(bar);
      stages=new Label {Text="检查环境     /     安装依赖     /     初始化     /     进入编辑器",ForeColor=Color.FromArgb(124,142,167),Location=new Point(40,277),Size=new Size(600,30)};card.Controls.Add(stages);
      note=new Label {Text="首次安装可能需要联网。图片编辑与项目保存均在本机完成。\n请等待初始化完成；日常启动会复用已安装的环境。",ForeColor=Color.FromArgb(130,145,165),Location=new Point(42,330),Size=new Size(596,56)};card.Controls.Add(note);
      retry=new Button {Text="重试",Location=new Point(42,402),Size=new Size(100,32),Visible=false,FlatStyle=FlatStyle.Flat,BackColor=Color.FromArgb(35,95,156),ForeColor=Color.White};retry.Click+=async(s,e)=>await StartEditor();card.Controls.Add(retry);
      logs=new Button {Text="打开日志目录",Location=new Point(156,402),Size=new Size(128,32),Visible=false,FlatStyle=FlatStyle.Flat};logs.Click+=(s,e)=>Process.Start(new ProcessStartInfo("explorer.exe","\""+Program.Home+"\"") {UseShellExecute=true});card.Controls.Add(logs);
      Controls.Add(setup);
    }
    void Progress(int percent,string message,string description) {
      if(IsDisposed||closing)return;
      if(InvokeRequired){BeginInvoke(new Action(()=>Progress(percent,message,description)));return;}
      bar.Value=Math.Max(0,Math.Min(100,percent));title.Text=message;detail.Text=description;
      stages.Text=(percent<25?"检查环境":percent<78?"安装依赖":percent<95?"初始化":"进入编辑器")+"  ·  "+bar.Value+"%";
    }
    void Log(string text) {lock(logLock)try{File.AppendAllText(Path.Combine(Program.Home,"desktop.log"),DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+" "+text+Environment.NewLine);}catch{}}
    async Task StartEditor() {
      if(running||closing)return;running=true;retry.Visible=false;logs.Visible=false;setup.Visible=true;
      if(browser!=null){browser.Dispose();browser=null;loaded=false;}StopOwnedService();
      try {
        if(Program.InstallerPreview){Progress(38,"正在安装运行依赖","正在准备本地运行环境与图片处理组件，请保持网络连接。");await Task.Delay(300);using(var image=new Bitmap(setup.Width,setup.Height)){setup.DrawToBitmap(image,setup.ClientRectangle);image.Save(Path.Combine(Program.Home,"installer-preview.png"),System.Drawing.Imaging.ImageFormat.Png);}closing=true;Close();return;}
        installer=new Installer(Progress,cancellation.Token);await installer.Prepare();
        await StartServer();
        if(Program.SelfTest) {File.WriteAllText(Path.Combine(Program.Home,"self-test.json"),Installer.Json.Serialize(new {ok=true,version=Program.Version,appPath=installer.AppPath,nodePath=installer.NodePath,address=address,webView2=CoreWebView2Environment.GetAvailableBrowserVersionString()}));closing=true;Close();return;}
        await OpenEditor();
      }catch(OperationCanceledException){}catch(Exception error){
        ExitCode=1;Log(error.ToString());StopOwnedService();
        if(browser!=null){browser.Dispose();browser=null;}loaded=false;
        if(!closing){title.Text="初始化尚未完成";detail.Text=ShortError(error);stages.Text="请检查网络、磁盘空间或日志，然后重试。";retry.Visible=true;logs.Visible=true;}
        if(Program.SelfTest){closing=true;Close();}
      }finally{running=false;}
    }
    string ShortError(Exception error) {string text=error.Message.Replace("\r","").Replace("\n"," ");return text.Length>180?text.Substring(0,180)+"…":text;}
    async Task StartServer() {
      string data=Path.Combine(Program.Home,"data");Directory.CreateDirectory(data);int preferred=4322;
      string settings=Path.Combine(Program.Home,"desktop-settings.json");
      try{var config=Installer.Json.Deserialize<Dictionary<string,int>>(File.ReadAllText(settings));preferred=config["port"];if(preferred<1024||preferred>65000)preferred=4322;}catch{}
      // Only reuse a server when its session token and data directory match the local runtime record.
      try {
        var record=Installer.Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(data,"runtime.json")));
        int oldPort=Convert.ToInt32(record["port"]);if(oldPort<1024||oldPort>65535)throw new IOException("无效端口");
        string url="http://127.0.0.1:"+oldPort;
        var session=await Session(url);
        if((string)session["token"]==(string)record["token"]&&(string)session["dataDirectory"]==data&&(string)session["name"]=="bio-annotation"&&(string)session["release"]==Program.Version) {address=url;token=(string)record["token"];Log("复用已有本地服务 "+url);return;}
      }catch{}
      for(int offset=0;offset<32;offset++) {
        cancellation.Token.ThrowIfCancellationRequested();int port=preferred+offset;
        var probe=new TcpListener(IPAddress.Loopback,port);try{probe.Start();}catch(SocketException){continue;}finally{probe.Stop();}
        address="http://127.0.0.1:"+port;Progress(96,"正在启动本地编辑服务","准备图片导入、项目保存与 PNG 导出。");
        var info=new ProcessStartInfo(installer.NodePath,"server.mjs") {WorkingDirectory=installer.AppPath,UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=System.Text.Encoding.UTF8,StandardErrorEncoding=System.Text.Encoding.UTF8};
        info.EnvironmentVariables["BIO_DATA_DIR"]=data;info.EnvironmentVariables["BIO_PORT"]=port.ToString();
        info.EnvironmentVariables["BIO_FONT_PATH"]=Path.Combine(installer.AppPath,"dist","fonts","NotoSansCJKsc-Regular.otf");
        service=Process.Start(info);job=new JobObject();job.Add(service);
        service.OutputDataReceived+=(s,e)=>{if(e.Data!=null)Log("server: "+e.Data);};service.ErrorDataReceived+=(s,e)=>{if(e.Data!=null)Log("server error: "+e.Data);};service.BeginOutputReadLine();service.BeginErrorReadLine();
        bool ready=false;
        for(int n=0;n<100;n++) {
          cancellation.Token.ThrowIfCancellationRequested();if(service.HasExited)break;
          try{var session=await Session(address);var record=Installer.Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(data,"runtime.json")));
            if((string)session["dataDirectory"]==data && (string)session["token"]==(string)record["token"] && Convert.ToInt32(record["pid"])==service.Id) {token=(string)session["token"];ready=true;break;}
          }catch{}await Task.Delay(150,cancellation.Token);
        }
        if(ready){File.WriteAllText(settings,Installer.Json.Serialize(new {port=port}));Log("本地服务就绪 "+address);return;}
        StopOwnedService();
        throw new IOException("本地编辑服务未能启动。请查看日志，确认安装目录可写且端口未被占用。");
      }
      throw new IOException("未找到空闲的本地端口，请关闭占用端口的程序后重试。");
    }
    async Task<Dictionary<string,object>> Session(string url) {return Installer.Json.Deserialize<Dictionary<string,object>>(await local.GetStringAsync(url+"/api/session"));}
    async Task OpenEditor() {
      browser=new WebView2 {Dock=DockStyle.Fill,DefaultBackgroundColor=Color.FromArgb(237,241,247)};
      Controls.Add(browser);browser.BringToFront();
      string additional=Program.DiagnosticPort>0?"--remote-debugging-port="+Program.DiagnosticPort:"";
      var options=new CoreWebView2EnvironmentOptions(additional);options.Language="zh-CN";
      var environment=await CoreWebView2Environment.CreateAsync(null,Path.Combine(Program.Home,"webview-profile"),options);
      await browser.EnsureCoreWebView2Async(environment);cancellation.Token.ThrowIfCancellationRequested();
      var core=browser.CoreWebView2;
      core.Settings.IsStatusBarEnabled=false;core.Settings.AreBrowserAcceleratorKeysEnabled=false;core.Settings.IsZoomControlEnabled=false;
      core.Settings.AreDevToolsEnabled=Program.DiagnosticPort>0;
      core.NavigationStarting+=(s,e)=>{if(!e.Uri.StartsWith(address+"/",StringComparison.OrdinalIgnoreCase)&&e.Uri!="about:blank")e.Cancel=true;};
      core.NewWindowRequested+=(s,e)=>{e.Handled=true;};
      core.WebMessageReceived+=OnMessage;
      core.DownloadStarting+=(s,e)=> {
        // Blob downloads retain the browser's Save As behavior inside the desktop window.
        var deferral=e.GetDeferral();try{using(var dialog=new SaveFileDialog()){dialog.FileName=Path.GetFileName(e.ResultFilePath);dialog.Filter="所有文件 (*.*)|*.*";dialog.OverwritePrompt=true;if(dialog.ShowDialog(this)==DialogResult.OK){e.ResultFilePath=dialog.FileName;e.Handled=true;}else e.Cancel=true;}}finally{deferral.Complete();}
      };
      core.PermissionRequested+=(s,e)=> {
        if(e.PermissionKind==CoreWebView2PermissionKind.ClipboardRead&&e.Uri.StartsWith(address+"/",StringComparison.OrdinalIgnoreCase)&&e.IsUserInitiated)e.State=CoreWebView2PermissionState.Allow;
      };
      core.ProcessFailed+=(s,e)=>{loaded=false;MessageBox.Show(this,"界面运行进程已停止。已保存的项目仍然保留，请重新打开程序。","生物图片编辑器",MessageBoxButtons.OK,MessageBoxIcon.Error);};
      core.NavigationCompleted+=(s,e)=> {
        if(!e.IsSuccess){loaded=false;setup.BringToFront();setup.Visible=true;title.Text="编辑界面加载失败";detail.Text="请查看日志并重试。";retry.Visible=true;logs.Visible=true;Log("WebView navigation failed: "+e.WebErrorStatus);return;}
        // The React editor reports readiness after fonts, session and drafts are initialized.
      };
      core.Navigate(address+"/");ExitCode=0;
    }
    async void OnMessage(object sender,CoreWebView2WebMessageReceivedEventArgs e) {
      if(e.Source!=address+"/"||closing)return;
      try {
        var value=Installer.Json.Deserialize<Dictionary<string,object>>(e.WebMessageAsJson);string type=(string)value["type"];
        if(type=="diagnostic-capture"&&Program.DiagnosticPort>0){using(var file=File.Create(Path.Combine(Program.Home,"editor-preview.png")))await browser.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,file);Log("诊断预览已生成");}
        else if(type=="diagnostic-close"&&Program.DiagnosticPort>0)Close();
        else if(type=="editor-ready"&&!loaded){loaded=true;setup.Visible=false;browser.Focus();Log("编辑界面已打开");}
        else if(type=="close-state"&&closeRequested) {
          closeRequested=false;
          if(value.ContainsKey("busy")&&(bool)value["busy"]){MessageBox.Show(this,"当前操作尚未完成，请等待后再关闭窗口。","生物图片编辑器");return;}
          string warning=value.ContainsKey("error")?(string)value["error"]:"";
          bool dirty=value.ContainsKey("dirty")&&(bool)value["dirty"];
          if(!String.IsNullOrEmpty(warning)) {MessageBox.Show(this,"草稿保存失败，请先保存项目或导出便携包再关闭。\n"+warning,"生物图片编辑器",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;}
          if(dirty&&MessageBox.Show(this,"有图片尚未显式保存。草稿已保留，是否关闭程序？\n如需可靠备份，请先保存项目或导出便携包。","生物图片编辑器",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
          closing=true;Close();
        }
      }catch(Exception error){Log(error.ToString());closeRequested=false;}
    }
    async void OnClosing(object sender,FormClosingEventArgs e) {
      if(closing)return;
      if(!loaded||browser==null){closing=true;cancellation.Cancel();return;}
      e.Cancel=true;if(closeRequested)return;closeRequested=true;
      try{await browser.CoreWebView2.ExecuteScriptAsync("window.dispatchEvent(new Event('bio-desktop-close'))");
        await Task.Delay(8000);if(closeRequested&&!closing){closeRequested=false;MessageBox.Show(this,"界面未响应关闭请求。请先保存项目或导出便携包，再重试关闭。","生物图片编辑器");}
      }catch(Exception error){closeRequested=false;Log(error.Message);if(MessageBox.Show(this,"界面未响应。是否关闭程序？已保存项目会保留。","生物图片编辑器",MessageBoxButtons.YesNo)==DialogResult.Yes){closing=true;Close();}}
    }
    void StopOwnedService() {
      if(service!=null) {
        try {if(!service.HasExited){if(token!=null){using(var request=new HttpRequestMessage(HttpMethod.Post,address+"/api/stop")){request.Headers.Add("x-bio-token",token);local.SendAsync(request).GetAwaiter().GetResult();}}if(!service.WaitForExit(1500))service.Kill();}}catch{try{if(!service.HasExited)service.Kill();}catch{}}
        service.Dispose();service=null;
      }
      if(job!=null){job.Dispose();job=null;}
    }
  }
  // KILL_ON_JOB_CLOSE prevents our Node child from surviving a desktop crash.
  internal sealed class JobObject : IDisposable {
    IntPtr handle;
    [StructLayout(LayoutKind.Sequential)] struct BasicLimits {public long perProcess,perJob;public uint flags;public UIntPtr minWorking,maxWorking;public uint active;public UIntPtr affinity;public uint priority,scheduling;}
    [StructLayout(LayoutKind.Sequential)] struct Counters {public ulong readOps,writeOps,otherOps,readBytes,writeBytes,otherBytes;}
    [StructLayout(LayoutKind.Sequential)] struct Limits {public BasicLimits basic;public Counters io;public UIntPtr processMemory,jobMemory,peakProcess,peakJob;}
    [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr attrs,string name);
    [DllImport("kernel32.dll")] static extern bool SetInformationJobObject(IntPtr job,int type,IntPtr data,uint size);
    [DllImport("kernel32.dll")] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
    internal JobObject() {handle=CreateJobObject(IntPtr.Zero,null);if(handle==IntPtr.Zero)throw new IOException("无法创建本地服务进程管理器。");var limits=new Limits();limits.basic.flags=0x2000;int size=Marshal.SizeOf(limits);IntPtr buffer=Marshal.AllocHGlobal(size);try{Marshal.StructureToPtr(limits,buffer,false);if(!SetInformationJobObject(handle,9,buffer,(uint)size))throw new IOException("无法设置本地服务退出规则。");}finally{Marshal.FreeHGlobal(buffer);}}
    internal void Add(Process process) {if(!AssignProcessToJobObject(handle,process.Handle))throw new IOException("无法管理本地服务进程，请重试。");}
    public void Dispose(){if(handle!=IntPtr.Zero){CloseHandle(handle);handle=IntPtr.Zero;}}
  }
}
