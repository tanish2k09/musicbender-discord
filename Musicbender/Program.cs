using System;
using System.Threading.Tasks;
using Musicbender.Handlers.Data;
using Musicbender.Data;
using Musicbender.Handlers;
using Musicbender.Helpers.Security;
using DSharpPlus;
using DSharpPlus.VoiceNext;

namespace Musicbender
{
  class Program
  {
    private static DiscordShardedClient discord;

    static void Main(string[] args)
    {
      MainAsync(args).ConfigureAwait(false).GetAwaiter().GetResult();
    }

    private static async Task MainAsync(string[] args)
    {
      await CredentialsKeeper.ReadCreds(args[0]);
      DatabaseHandler.InitDB();

      discord = new DiscordShardedClient(new DiscordConfiguration
      {
        Token = CredentialsKeeper.Token,
        TokenType = TokenType.Bot
      }
      );

      await discord.UseVoiceNextAsync(new VoiceNextConfiguration());

      CredentialsKeeper.WipeToken();

      discord.MessageCreated += async e =>
      {
        if (e.Message.Content.StartsWith(CredentialsKeeper.Prefix))
          await MessageEventHandler.HandleCreation(e);
      };

      await discord.StartAsync();

      Console.WriteLine(Strings.Ready);

      await Task.Delay(-1);
    }
  }
}
