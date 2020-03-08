using DSharpPlus;
using DSharpPlus.Entities;
using DSharpPlus.EventArgs;
using DSharpPlus.VoiceNext;
using Musicbender.Data;
using Musicbender.Handlers;
using Musicbender.Handlers.Data;
using Musicbender.Helpers.Security;
using System;
using System.Text;
using System.Threading.Tasks;

namespace Musicbender.Helpers.Commands
{
  class EffectHandler
  {
    public static async Task<string> Execute(MessageCreateEventArgs e, string name)
    {
      var VoiceChannel = await EnforcementHandler.EnforceVoice(e.Message);
      if (VoiceChannel == null)
        return Strings.NotInVC;

      // TODO: Queue handler

      // TODO: Effect cache redirection from IO classes before db access
      Effect effect = await DatabaseHandler.GetEffect(e.Channel.GuildId, name);

      if (effect == null)
        return "Effect \"" + name + "\" not found...";

      await JoinVoiceChannel(VoiceChannel, e.Client);
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

    private static async Task JoinVoiceChannel(DiscordChannel VC, DiscordClient client)
    {
      DiscordMember Self = await VC.Guild.GetMemberAsync(CredentialsKeeper.SelfID);
      
      try
      {
        await client.GetVoiceNext().ConnectAsync(VC);
      } catch (DSharpPlus.Exceptions.BadRequestException e)
      {
        Console.WriteLine(e.JsonMessage.ToString());
      }
    }

    public static async Task Clear(MessageCreateEventArgs e)
    {
      // TODO: Clear queue
    }
  }
}
