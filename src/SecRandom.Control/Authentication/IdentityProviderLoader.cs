using Microsoft.Extensions.Configuration;
using SecRandom.Control.Setup;

namespace SecRandom.Control.Authentication;


















public static class IdentityProviderLoader
{
    



    public sealed record Selection(
        IIdentityProviderModule? Module,
        string? Refusal,
        IReadOnlyList<string> Diagnostics,
        IReadOnlyList<IIdentityProviderModule> Installed);

    
    public static Selection Select(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var requested = configuration[IdentityProviderSetting.VariableName]?.Trim();

        
        if (!string.IsNullOrEmpty(requested))
        {
            var present = EnumerateInstalled();
            var module = IdentityProviderSetting.TryResolve(requested, out var failure);
            if (module is not null)
            {
                return new Selection(module, null, [], present);
            }

            return new Selection(
                null,
                $"已通过 {IdentityProviderSetting.VariableName} 点名身份源 \"{requested}\"，但没能加载它：{failure}。"
                + $"请把 {IdentityProviderSetting.ModuleFileName(requested)} 放进应用目录（随发布产物一起发布），"
                + $"或者清掉 {IdentityProviderSetting.VariableName} 让核心按已配置的环境变量推断身份源。",
                [],
                present);
        }

        
        var installed = IdentityProviderSetting.ResolveInstalled(out var problems);
        if (installed.Count == 0)
        {
            return new Selection(null, null, problems, installed);
        }

        var configured = new List<IIdentityProviderModule>();
        var diagnostics = new List<string>(problems);
        foreach (var module in installed)
        {
            bool isConfigured;
            try
            {
                isConfigured = module.IsConfigured(configuration);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                diagnostics.Add(
                    $"身份源模块 {module.Name} 在回答\"配置好了吗\"时抛了异常（按没配好处理）："
                    + $"{exception.GetType().Name} {exception.Message}");
                continue;
            }

            if (isConfigured)
            {
                configured.Add(module);
            }
        }

        if (configured.Count == 1)
        {
            return new Selection(configured[0], null, diagnostics, installed);
        }

        if (configured.Count == 0)
        {
            
            if (installed.Count == 1 && installed[0] is IInstanceProvisioner)
            {
                return new Selection(installed[0], null, diagnostics, installed);
            }

            return new Selection(null, null, diagnostics, installed);
        }

        var names = string.Join("、", configured.Select(module => module.Name));
        return new Selection(
            null,
            $"应用目录里装了多个身份源模块，其中 {names} 都表示自己的配置已经存在，核心无法判断这次该用哪一个："
            + $"请显式设置 {IdentityProviderSetting.VariableName} 点名要用的身份源。",
            diagnostics,
            installed);
    }

    private static IReadOnlyList<IIdentityProviderModule> EnumerateInstalled()
    {
        try
        {
            return IdentityProviderSetting.ResolveInstalled(out _);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return [];
        }
    }
}
