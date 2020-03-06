using DSharpPlus.Entities;
using System;
using System.Threading.Tasks;

namespace Musicbender.Handlers
{
  class EnforcementHandler
  {
    public static bool EnforceInitial(DSharpPlus.Entities.DiscordMessage message)
    {
      // Don't listen to bot input
      // TODO: Make this configurable -> Bot allowed? Self allowed?
      if (message.Author.IsBot)
        return false;

      // TODO: Check for guild's permission allowance. Operator access might be locked.

      return true;
    }

    public static async Task<bool> EnforceVoice(DSharpPlus.Entities.DiscordMessage message)
    {
      try
      {
        DiscordMember member = (await message.Channel.Guild.GetMemberAsync(message.Author.Id));
        return member.VoiceState.Channel != null;
      } catch (Exception e)
      {
        Console.WriteLine(e.StackTrace);
        return false;
      }
      
    }
  }
}
