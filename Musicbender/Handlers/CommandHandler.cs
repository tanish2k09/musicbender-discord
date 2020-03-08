using DSharpPlus.EventArgs;
using Musicbender.Data;
using Musicbender.Helpers.Commands;
using Musicbender.Helpers.Security;
using System.Threading.Tasks;

namespace Musicbender.Handlers
{
  class CommandHandler
  {
    public static async Task Execute(MessageCreateEventArgs e)
    {
      /* Execute is a generic method to streamline all perm types.
       * Choose the proper method to use
       * Use the user perms to trigger a method instead of triggering a method and checking perms
       * Reduces permission-checks' code length and increases maintainability
       * 
       * NOTE: Execute functions cascade down the permissions ladder until a command hit is found
       */

      string command = ArgumentRenderer.Command(e.Message.Content);
      command = CommandStore.GetActualCommand(command);

      if (CredentialsKeeper.IsDev(e.Author.Id))
        await ExecuteDev(e, command);
      else if (CredentialsKeeper.IsAdmin(e.Message.Author.Id))
        await ExecuteAdmin(e, command);
      else if (CredentialsKeeper.IsOperator(e.Message.Author.Id))
        await ExecuteOperator(e, command);
      else
        await ExecutePublic(e, command);
    }

    /* All commands executable by the developers only will be listed here */
    private static async Task ExecuteDev(MessageCreateEventArgs e, string command)
    {
      switch(command)
      {
        case "shutdown":
          await CommandExecutionHelper.Shutdown();
          break;
        default:
          await ExecuteAdmin(e, command);
          break;
      }
    }

    /* All commands executable by admins will be listed here */
    private static async Task ExecuteAdmin(MessageCreateEventArgs e, string command)
    {
      switch (command)
      {
        case "alias":
          await CommandExecutionHelper.SetupAlias(e.Message);
          break;

        default:
          await ExecuteOperator(e, command);
          break;
      }
    }

    /* All commands executable by operators will be listed here */
    private static async Task ExecuteOperator(MessageCreateEventArgs e, string command)
    {
      switch (command)
      {
        // TODO: Communicate with youtube URL parser and the DB
        case "addeffect":
          await CommandExecutionHelper.Reply(e.Message, Strings.NotMuch);
          break;

        // TODO: Settings include timeout, blacklist and whitelist
        // TODO: Settings are guild-specific
        case "listsettings":
          await CommandExecutionHelper.Reply(e.Message, Strings.NotMuch);
          break;

        case "clear":
          await EffectHandler.Clear(e);
          break;

        default:
          if (command.StartsWith(Strings.EffectPrefix))
            await CommandExecutionHelper.TryEffect(e, command);
          else
            await ExecutePublic(e, command);
          break;
      }
    }

    private static async Task ExecutePublic(MessageCreateEventArgs e, string command)
    {
      switch (command)
      {
        // TODO: Make List methods have paginated response with reactions
        // TODO: Effects are guild-specific
        case "listeffects":
          await CommandExecutionHelper.ListEffects(e.Message);
          break;

        default:
          await CommandExecutionHelper.Reply(e.Message, Strings.Noop);
          break;
      }
    }
  }
}
