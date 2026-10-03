using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("生物图片编辑器")]
[assembly: AssemblyProduct("生物图片编辑器")]
[assembly: AssemblyDescription("本地生物医学图片编辑与标注 · v2.1-p")]
[assembly: AssemblyVersion("2.1.0.0")]
[assembly: AssemblyFileVersion("2.1.0.0")]
[assembly: AssemblyInformationalVersion("2.1-p")]

namespace BioPictureEditor {
  internal static class Program {
    internal static string Home, SdkPath;
    internal static bool ForceDownload, SelfTest, InstallerPreview;
    internal static int DiagnosticPort;
    internal const string Version = "v2.1-p";
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern bool SetDllDirectory(string path);
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hwnd, int command);
    [STAThread] static int Main(string[] args) {
      // Some launch hosts inject both Path and PATH; .NET Framework rejects that
      // when constructing a child's environment. Normalize only this process.
      var groups=new Dictionary<string,List<string>>(StringComparer.OrdinalIgnoreCase);
      foreach(string name in Environment.GetEnvironmentVariables().Keys) {if(!groups.ContainsKey(name))groups[name]=new List<string>();groups[name].Add(name);}
      foreach(var group in groups)if(group.Value.Count>1) {string value=Environment.GetEnvironmentVariable(group.Key);foreach(string name in group.Value)Environment.SetEnvironmentVariable(name,null);Environment.SetEnvironmentVariable(group.Key,value);}
      Home = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Bio-Picture-Editor", "v2.1-p");
      for (int n=0;n<args.Length;n++) {
        if(args[n]=="--profile" && n+1<args.Length) Home=Path.GetFullPath(args[++n]);
        else if(args[n]=="--force-download") ForceDownload=true;
        else if(args[n]=="--self-test") SelfTest=true;
        else if(args[n]=="--installer-preview") InstallerPreview=true;
        else if(args[n]=="--diagnostic-port" && n+1<args.Length) DiagnosticPort=int.Parse(args[++n]);
        else { MessageBox.Show("无法识别的启动参数。", "生物图片编辑器"); return 2; }
      }
      Application.EnableVisualStyles(); SetProcessDPIAware(); Application.SetCompatibleTextRenderingDefault(false);
      Directory.CreateDirectory(Home);
      string key=Hash(System.Text.Encoding.UTF8.GetBytes(Home.ToLowerInvariant())).Substring(0,24);
      bool first;
      using(var mutex = new Mutex(true,"Local\\BioPictureEditor-"+key,out first)) {
        if(!first) {
          try { var other=Process.GetProcessById(int.Parse(File.ReadAllText(Path.Combine(Home,"desktop.pid")))); ShowWindow(other.MainWindowHandle,9); SetForegroundWindow(other.MainWindowHandle); } catch {}
          return 0;
        }
        try {
          File.WriteAllText(Path.Combine(Home,"desktop.pid"),Process.GetCurrentProcess().Id.ToString());
          SdkPath=Path.Combine(Home,"desktop-sdk",BuildInfo.SdkVersion);
          Directory.CreateDirectory(SdkPath);
          foreach(string file in new[]{"Microsoft.Web.WebView2.Core.dll","Microsoft.Web.WebView2.WinForms.dll","WebView2Loader.dll"}) ExtractResource(file,Path.Combine(SdkPath,file));
          SetDllDirectory(SdkPath);
          AppDomain.CurrentDomain.AssemblyResolve+=(sender,eventArgs)=> {
            string name=new AssemblyName(eventArgs.Name).Name;
            if(name=="Microsoft.Web.WebView2.Core"||name=="Microsoft.Web.WebView2.WinForms") return Assembly.LoadFrom(Path.Combine(SdkPath,name+".dll"));
            return null;
          };
          return Run();
        } catch(Exception error) {
          File.AppendAllText(Path.Combine(Home,"desktop.log"),DateTime.Now+" "+error+Environment.NewLine);
          MessageBox.Show("启动失败："+error.Message+"\n日志目录："+Home,"生物图片编辑器",MessageBoxButtons.OK,MessageBoxIcon.Error);
          return 1;
        } finally { try{File.Delete(Path.Combine(Home,"desktop.pid"));}catch{} mutex.ReleaseMutex(); }
      }
    }
    [MethodImpl(MethodImplOptions.NoInlining)] static int Run() {
      using(var form=new MainForm()) { Application.Run(form); return form.ExitCode; }
    }
    internal static void ExtractResource(string name,string dest) {
      using(var input=Assembly.GetExecutingAssembly().GetManifestResourceStream(name)) {
        if(input==null) throw new IOException("安装资源缺失："+name);
        using(var buffer=new MemoryStream()) { input.CopyTo(buffer); byte[] bytes=buffer.ToArray();
          if(File.Exists(dest) && Hash(File.ReadAllBytes(dest))==Hash(bytes)) return;
          string temp=dest+".tmp"; File.WriteAllBytes(temp,bytes); if(File.Exists(dest))File.Delete(dest); File.Move(temp,dest);
        }
      }
    }
    internal static string Hash(byte[] bytes) {using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
    internal static string FileHash(string file) {using(var stream=File.OpenRead(file))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();}
    internal static Icon AppIcon() { using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("app.ico"))return new Icon(stream); }
  }
}
