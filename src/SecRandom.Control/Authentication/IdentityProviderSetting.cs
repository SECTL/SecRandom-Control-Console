using System.Reflection;
using System.Runtime.Loader;

namespace SecRandom.Control.Authentication;
















public static class IdentityProviderSetting
{
    
    public const string VariableName = "CTRL_AUTH_PROVIDER";

    
    public const string AssemblyPrefix = "SecRandom.Control.Identity.";

    
    public const string AssemblyExtension = ".dll";

    


    public static bool IsModuleName(string? assemblyName, string providerName) =>
        !string.IsNullOrWhiteSpace(assemblyName)
        && !string.IsNullOrWhiteSpace(providerName)
        && string.Equals(assemblyName.Trim(), AssemblyPrefix + providerName.Trim(),
            StringComparison.OrdinalIgnoreCase);

    
    internal static string ModuleFileName(string providerName) =>
        AssemblyPrefix + providerName.Trim() + AssemblyExtension;

    




    internal static IIdentityProviderModule? TryResolve(string providerName, out string? failure)
    {
        failure = null;
        if (string.IsNullOrWhiteSpace(providerName))
        {
            failure = "身份源名字是空的";
            return null;
        }

        var name = providerName.Trim();
        var assemblyName = AssemblyPrefix + name;

        
        foreach (var loaded in AppDomain.CurrentDomain.GetAssemblies())
        {
            if (!IsModuleName(loaded.GetName().Name, name))
            {
                continue;
            }

            if (CreateModule(loaded) is { } cached)
            {
                return cached;
            }

            failure = $"程序集 {loaded.GetName().Name} 里没有实现 {nameof(IIdentityProviderModule)} 的公开类型";
            return null;
        }

        
        var path = Path.Combine(AppContext.BaseDirectory, ModuleFileName(name));
        if (File.Exists(path))
        {
            try
            {
                var module = CreateModule(AssemblyLoadContext.Default.LoadFromAssemblyPath(path));
                if (module is not null)
                {
                    return module;
                }

                failure = $"{Path.GetFileName(path)} 里没有实现 {nameof(IIdentityProviderModule)} 的公开类型";
                return null;
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                failure = $"加载 {Path.GetFileName(path)} 失败：{exception.GetType().Name} {exception.Message}";
                return null;
            }
        }

        
        try
        {
            var module = CreateModule(Assembly.Load(new AssemblyName(assemblyName)));
            if (module is not null)
            {
                return module;
            }

            failure = $"程序集 {assemblyName} 里没有实现 {nameof(IIdentityProviderModule)} 的公开类型";
            return null;
        }
        catch (Exception exception) when (exception is FileNotFoundException or FileLoadException or BadImageFormatException)
        {
            failure = $"应用目录里没有 {ModuleFileName(name)}，按名字加载 {assemblyName} 也失败：{exception.GetType().Name} {exception.Message}";
            return null;
        }
    }

    



    internal static IReadOnlyList<IIdentityProviderModule> ResolveInstalled(out IReadOnlyList<string> problems)
    {
        var modules = new List<IIdentityProviderModule>();
        var failures = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            var assemblyName = assembly.GetName().Name;
            if (assemblyName is null
                || !assemblyName.StartsWith(AssemblyPrefix, StringComparison.OrdinalIgnoreCase)
                || !seen.Add(assemblyName))
            {
                continue;
            }

            if (CreateModule(assembly) is { } module)
            {
                modules.Add(module);
            }
            else
            {
                failures.Add($"程序集 {assemblyName} 里没有实现 {nameof(IIdentityProviderModule)} 的公开类型");
            }
        }

        foreach (var path in EnumerateModuleFiles())
        {
            var fileName = Path.GetFileNameWithoutExtension(path);
            if (!seen.Add(fileName))
            {
                continue;
            }

            try
            {
                if (CreateModule(AssemblyLoadContext.Default.LoadFromAssemblyPath(path)) is { } module)
                {
                    modules.Add(module);
                }
                else
                {
                    failures.Add($"{Path.GetFileName(path)} 里没有实现 {nameof(IIdentityProviderModule)} 的公开类型");
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                failures.Add($"加载 {Path.GetFileName(path)} 失败：{exception.GetType().Name} {exception.Message}");
            }
        }

        problems = failures;
        return modules;
    }

    private static IEnumerable<string> EnumerateModuleFiles()
    {
        try
        {
            return Directory.Exists(AppContext.BaseDirectory)
                ? Directory.EnumerateFiles(AppContext.BaseDirectory, AssemblyPrefix + "*" + AssemblyExtension)
                    .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
                    .ToArray()
                : [];
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            return [];
        }
    }

    private static IIdentityProviderModule? CreateModule(Assembly assembly)
    {
        Type?[] types;
        try
        {
            types = assembly.GetTypes();
        }
        catch (ReflectionTypeLoadException exception)
        {
            
            types = exception.Types;
        }

        foreach (var type in types)
        {
            if (type is null || !type.IsPublic || type.IsAbstract || type.IsInterface)
            {
                continue;
            }

            if (!typeof(IIdentityProviderModule).IsAssignableFrom(type)
                || type.GetConstructor(Type.EmptyTypes) is null)
            {
                continue;
            }

            if (Activator.CreateInstance(type) is IIdentityProviderModule module)
            {
                return module;
            }
        }

        return null;
    }
}
