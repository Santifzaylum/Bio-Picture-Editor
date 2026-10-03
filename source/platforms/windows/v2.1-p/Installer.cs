using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Microsoft.Web.WebView2.Core;

namespace BioPictureEditor {
  internal class Installer {
    internal string AppPath, NodePath;
    readonly Action<int,string,string> progress;
    readonly CancellationToken cancel;
    internal Installer(Action<int,string,string> progress,CancellationToken cancel) {this.progress=progress;this.cancel=cancel;AppPath=Path.Combine(Program.Home,"app",Program.Version+"-"+BuildInfo.PayloadHash.Substring(0,12));}
    internal static JavaScriptSerializer Json=new JavaScriptSerializer {MaxJsonLength=4000000};
    internal async Task Prepare() {
      progress(4,"正在检查运行环境","首次使用会自动安装依赖；已安装的环境将直接复用。");
      await Task.Run(()=>InstallApp(),cancel);
      await PrepareNode();
      progress(69,"正在验证图片处理依赖","检查图片导入、中文字体和导出组件。");
      string output=await Run(NodePath,"dependency-check.mjs",AppPath,60000);
      if(!output.Contains("BIO_DEPENDENCIES_OK"))throw new IOException("图片处理组件检查失败："+output);
      await PrepareWebView();
      File.WriteAllText(Path.Combine(Program.Home,"active-install.json"),Json.Serialize(new {version=Program.Version,appPath=AppPath,nodePath=NodePath,dataPath=Path.Combine(Program.Home,"data")}));
      progress(94,"初始化完成，正在启动编辑器","你的项目数据会独立保存，后续升级会继续保留。");
    }
    bool ValidApp() {
      try {
        string file=Path.Combine(AppPath,"install-manifest.json");
        if(!File.Exists(file) || Program.FileHash(file)!=BuildInfo.ManifestHash)return false;
        var entries=Json.Deserialize<Dictionary<string,string>>(File.ReadAllText(file));
        foreach(var pair in entries) {cancel.ThrowIfCancellationRequested();string full=SafePath(AppPath,pair.Key);if(!File.Exists(full)||Program.FileHash(full)!=pair.Value)return false;}
        return true;
      }catch(OperationCanceledException){throw;}catch{return false;}
    }
    void InstallApp() {
      if(ValidApp()) {progress(22,"编辑组件已就绪","已验证现有安装，正在检查运行依赖。");return;}
      progress(10,"正在安装编辑组件","解压编辑界面、图片处理组件与内置中文字体。");
      string parent=Path.GetDirectoryName(AppPath);Directory.CreateDirectory(parent);
      string stage=Path.Combine(parent,".install-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(stage);
      try {
        using(var payload=Assembly.GetExecutingAssembly().GetManifestResourceStream("app-payload.zip")) {
          using(var memory=new MemoryStream()){payload.CopyTo(memory);if(Program.Hash(memory.ToArray())!=BuildInfo.PayloadHash)throw new IOException("应用安装包校验失败。");memory.Position=0;ExtractZip(memory,stage);}
        }
        string previous=AppPath;AppPath=stage;
        bool valid=ValidApp();AppPath=previous;if(!valid)throw new IOException("编辑组件文件校验失败。");
        if(Directory.Exists(AppPath))Directory.Move(AppPath,AppPath+".replaced-"+DateTime.UtcNow.Ticks);
        Directory.Move(stage,AppPath);
        progress(24,"编辑组件安装完成","已安装界面、字体和图片处理组件。");
      }finally {if(Directory.Exists(stage))Directory.Delete(stage,true);}
    }
    internal static string SafePath(string root,string relative) {
      string full=Path.GetFullPath(Path.Combine(root,relative.Replace('/',Path.DirectorySeparatorChar)));
      if(!full.StartsWith(Path.GetFullPath(root)+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new IOException("安装包包含不允许的路径。");return full;
    }
    void ExtractZip(Stream source,string dest) {
      using(var zip=new ZipArchive(source,ZipArchiveMode.Read,true))foreach(var entry in zip.Entries) {
        cancel.ThrowIfCancellationRequested();if(entry.FullName.EndsWith("/"))continue;
        string file=SafePath(dest,entry.FullName);Directory.CreateDirectory(Path.GetDirectoryName(file));
        using(var input=entry.Open())using(var output=File.Create(file))input.CopyTo(output);
      }
    }
    async Task PrepareNode() {
      string runtime=Path.Combine(Program.Home,"runtime");Directory.CreateDirectory(runtime);
      NodePath=Path.Combine(runtime,"node.exe");string marker=Path.Combine(runtime,"node-integrity.json");
      bool valid=false;
      if(File.Exists(NodePath)&&File.Exists(marker))try {var saved=Json.Deserialize<Dictionary<string,string>>(File.ReadAllText(marker));valid=Program.FileHash(NodePath)==saved["sha256"] && (!Program.ForceDownload||saved["sha256"]==BuildInfo.NodeExeHash);}catch{}
      if(valid) {progress(60,"本地运行环境已就绪","已检查本地 Node.js，无需重新安装。");return;}
      if(!Program.ForceDownload)foreach(string dir in (Environment.GetEnvironmentVariable("PATH")??"").Split(';')) {
        string candidate;
        try{candidate=Path.Combine(dir.Trim().Trim('"'),"node.exe");if(!File.Exists(candidate)||Path.GetFullPath(candidate)==NodePath)continue;}catch{continue;}
        try {
          string v=(await Run(candidate,"--version",AppPath,10000)).Trim();Version version;
          if(!Version.TryParse(v.TrimStart('v'),out version)||version.Major<22||version.Major>24||(version.Major==22&&version.Minor<12))continue;
          progress(40,"正在准备本地运行环境","复用电脑上已安装的兼容环境，无需联网下载。");
          File.Copy(candidate,NodePath+".tmp",true);cancel.ThrowIfCancellationRequested();ReplaceFile(NodePath+".tmp",NodePath);
          File.WriteAllText(marker,Json.Serialize(new Dictionary<string,string>{{"version",v},{"sha256",Program.FileHash(NodePath)},{"source","compatible-local-runtime"}}));return;
        }catch(OperationCanceledException){throw;}catch{}
      }
      string zip=Path.Combine(runtime,"node-"+BuildInfo.NodeVersion+".zip");
      if(!File.Exists(zip)||Program.FileHash(zip)!=BuildInfo.NodeZipHash) {
        progress(30,"正在下载运行依赖","从 Node.js 官方下载运行环境；首次安装需要联网。");
        await Download("https://nodejs.org/dist/"+BuildInfo.NodeVersion+"/node-"+BuildInfo.NodeVersion+"-win-x64.zip",zip,30,59);
      }
      progress(60,"正在安装运行依赖","校验官方 SHA-256，并准备独立运行环境。");
      if(Program.FileHash(zip)!=BuildInfo.NodeZipHash) {File.Delete(zip);throw new IOException("Node.js 下载校验失败，请点击重试。");}
      await Task.Run(()=> {
        using(var archive=ZipFile.OpenRead(zip)) {
          var binary=archive.GetEntry("node-"+BuildInfo.NodeVersion+"-win-x64/node.exe");if(binary==null)throw new IOException("运行环境安装包不完整。");
          binary.ExtractToFile(NodePath+".tmp",true);
          var license=archive.GetEntry("node-"+BuildInfo.NodeVersion+"-win-x64/LICENSE");if(license!=null)license.ExtractToFile(Path.Combine(runtime,"NODE-LICENSE.txt"),true);
        }
        if(Program.FileHash(NodePath+".tmp")!=BuildInfo.NodeExeHash)throw new IOException("运行程序校验失败。");
        cancel.ThrowIfCancellationRequested();ReplaceFile(NodePath+".tmp",NodePath);
        File.WriteAllText(marker,Json.Serialize(new Dictionary<string,string>{{"version",BuildInfo.NodeVersion},{"sha256",BuildInfo.NodeExeHash},{"source","nodejs.org"}}));
        File.Delete(zip);
      },cancel);
    }
    async Task PrepareWebView() {
      progress(78,"正在检查界面运行环境","检查 Microsoft WebView2，让原有界面在程序窗口中运行。");
      if(WebViewInstalled())return;
      string setup=Path.Combine(Program.Home,"runtime","MicrosoftEdgeWebview2Setup.exe");
      await Download("https://go.microsoft.com/fwlink/p/?LinkId=2124703",setup,79,83);
      progress(84,"正在安装界面运行依赖","正在安装 Microsoft WebView2，请保持网络连接。");
      VerifyMicrosoftInstaller(setup);
      await Run(setup,"/silent /install",Path.GetDirectoryName(setup),600000);
      if(!WebViewInstalled())throw new IOException("WebView2 安装尚未完成。请检查网络连接后点击重试。");
    }
    internal static bool WebViewInstalled() {
      try{return !String.IsNullOrEmpty(CoreWebView2Environment.GetAvailableBrowserVersionString());}catch{return false;}
    }
    static void ReplaceFile(string temp,string dest) {if(File.Exists(dest))File.Delete(dest);File.Move(temp,dest);}
    async Task Download(string url,string dest,int from,int to) {
      ServicePointManager.SecurityProtocol=SecurityProtocolType.Tls12;
      Exception last=null;
      for(int attempt=0;attempt<3;attempt++) {
      try {
        using(var handler=new HttpClientHandler()){if(handler.Proxy!=null)handler.Proxy.Credentials=CredentialCache.DefaultCredentials;
          using(var client=new HttpClient(handler)){client.Timeout=TimeSpan.FromMinutes(10);client.DefaultRequestHeaders.UserAgent.ParseAdd("Bio-Picture-Editor/2.1-p");
            using(var response=await client.GetAsync(url,HttpCompletionOption.ResponseHeadersRead,cancel)){response.EnsureSuccessStatusCode();
              long total=response.Content.Headers.ContentLength??0,count=0;
              using(var input=await response.Content.ReadAsStreamAsync())using(var output=new FileStream(dest+".part",FileMode.Create,FileAccess.Write,FileShare.None,65536,true)) {
                var buffer=new byte[65536];int size;long notified=0;
                while((size=await input.ReadAsync(buffer,0,buffer.Length,cancel))>0){await output.WriteAsync(buffer,0,size,cancel);count+=size;if(count-notified>512000){notified=count;progress(total>0?from+(int)((to-from)*count/total):from,"正在下载运行依赖",(count/1048576d).ToString("F1")+" MB"+(total>0?" / "+(total/1048576d).ToString("F1")+" MB":"")+" · 请保持网络连接");}}
              }
            }
          }
        }
        cancel.ThrowIfCancellationRequested();ReplaceFile(dest+".part",dest);return;
      }catch(OperationCanceledException){throw;}catch(Exception error){last=error;progress(from,"下载暂未完成，正在重试","正在尝试第 "+(attempt+1)+" / 3 次下载。");}
      await Task.Delay(1000,cancel);
      }
      throw new IOException("无法下载运行依赖，请检查网络或代理后点击重试。来源："+url+"\n"+last.Message,last);
    }
    internal async Task<string> Run(string file,string arguments,string cwd,int timeout) {
      var info=new ProcessStartInfo(file,arguments){WorkingDirectory=cwd,UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=System.Text.Encoding.UTF8,StandardErrorEncoding=System.Text.Encoding.UTF8};
      using(var child=Process.Start(info)) {
        var stdout=child.StandardOutput.ReadToEndAsync();var stderr=child.StandardError.ReadToEndAsync();
        try {var until=DateTime.UtcNow.AddMilliseconds(timeout);while(!child.HasExited){cancel.ThrowIfCancellationRequested();if(DateTime.UtcNow>until)throw new TimeoutException("依赖安装耗时过长，请重试。");await Task.Delay(120,cancel);}
          string output=await stdout,error=await stderr;if(child.ExitCode!=0)throw new IOException("依赖检查或安装失败（"+child.ExitCode+"）："+error+output);return output;
        }finally {try{if(!child.HasExited)child.Kill();}catch{}}
      }
    }
    // Windows Authenticode verifies the downloaded installer before execution.
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] class TrustFile {public uint cbStruct=(uint)Marshal.SizeOf(typeof(TrustFile));[MarshalAs(UnmanagedType.LPWStr)]public string file;public IntPtr handle=IntPtr.Zero,subject=IntPtr.Zero;}
    [StructLayout(LayoutKind.Sequential)] class TrustData {public uint cbStruct=(uint)Marshal.SizeOf(typeof(TrustData));public IntPtr callback=IntPtr.Zero,sip=IntPtr.Zero;public uint ui=2,revocation=0,choice=1;public IntPtr file;public uint action=0;public IntPtr state=IntPtr.Zero,url=IntPtr.Zero;public uint flags=0x1000,context=0;}
    [DllImport("wintrust.dll",ExactSpelling=true,CharSet=CharSet.Unicode)] static extern int WinVerifyTrust(IntPtr hwnd,[In]ref Guid action,[In]TrustData data);
    internal static void VerifyMicrosoftInstaller(string file) {
      var data=new TrustData();var native=new TrustFile {file=file};data.file=Marshal.AllocHGlobal(Marshal.SizeOf(native));
      try {Marshal.StructureToPtr(native,data.file,false);var action=new Guid("00AAC56B-CD44-11D0-8CC2-00C04FC295EE");if(WinVerifyTrust(new IntPtr(-1),ref action,data)!=0)throw new IOException("界面安装程序的数字签名校验失败。");
        using(var cert=new X509Certificate2(X509Certificate.CreateFromSignedFile(file)))if(!cert.Subject.Contains("O=Microsoft Corporation"))throw new IOException("界面安装程序并非由 Microsoft 签名。");
      }finally{Marshal.DestroyStructure(data.file,typeof(TrustFile));Marshal.FreeHGlobal(data.file);}
    }
  }
}
