using DSharpPlus.EventArgs;
using Musicbender.Data;
using System.Threading.Tasks;

namespace Musicbender.Helpers.Commands
{
  class CommandExecutionHelper
  {
    public static async Task Reply(DSharpPlus.Entities.DiscordMessage message, string response)
    {
      if (response.Length > 0)
        await message.RespondAsync(response);
    }

    // TODO: Setup aliases with the database
    public static async Task SetupAlias(DSharpPlus.Entities.DiscordMessage message)
    {
      // Make sure there are exactly 2 parts, an alias and the command.
      if (
        (await ArgumentRenderer.Split(message.Content, " as "))
        .Length != 2)
      {
        await Reply(message, Strings.WrongSyntax);
        return;
      }

      // The first part also contains "<prefix><alias>" word, strip that
      string[] parts = await ArgumentRenderer.Split(message.Content, " ");
      if (parts.Length != 4)
      {
        await Reply(message, Strings.WordsNotSentences);
        return;
      }

      await Reply(message, await CommandStore.Link(parts[1], parts[3]));
    }

    public static async Task ListEffects(DSharpPlus.Entities.DiscordMessage message)
    {
      await Reply(message, await EffectHandler.ListEffects(message.Channel.GuildId));
    }

    public static async Task TryEffect(MessageCreateEventArgs e, string command)
    {
      await Reply(
        e.Message, 
        await EffectHandler.Execute(e, 
        ArgumentRenderer.Effect(command)
        )
      );
    }

    // TODO: Create logic for shutdown confirmation
    public static async Task Shutdown()
    {
      // TODO: Reaction based on timer?
    }
  }
}
