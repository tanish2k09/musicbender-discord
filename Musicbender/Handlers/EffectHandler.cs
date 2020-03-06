using Musicbender.Data;
using Musicbender.Handlers;
using Musicbender.Handlers.Data;
using System.Text;
using System.Threading.Tasks;

namespace Musicbender.Helpers.Commands
{
  class EffectHandler
  {
    public static async Task<string> Execute(DSharpPlus.Entities.DiscordMessage message, string name)
    {
      if (! await EnforcementHandler.EnforceVoice(message))
        return Strings.NotInVC;

      // TODO: Queue handler

      // TODO: Effect cache redirection from IO classes before db access
      Effect effect = await DatabaseHandler.GetEffect(message.Channel.GuildId, name);

      if (effect == null)
        return "Effect \"" + name + "\" not found...";

      return "Execution complete, effect URL: " + effect.URL;
    }

    public static async Task<string> ListEffects(ulong GuildID)
    {
      StringBuilder builder = new StringBuilder();

      builder.Append("```");

      foreach (string effect in (await DatabaseHandler.ListEffects(GuildID)))
      {
        builder.Append(effect).Append("\n");
      }

      builder.Append("```");
      return builder.ToString();
    }
  }
}
