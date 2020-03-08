using DSharpPlus.EventArgs;
using System.Threading.Tasks;

namespace Musicbender.Handlers
{
	public class MessageEventHandler
	{
		public MessageEventHandler() { }

		public static async Task HandleCreation(MessageCreateEventArgs e)
		{
			// TODO: Enforce some basic checks before doing anything
			if (!EnforcementHandler.EnforceInitial(e.Message))
				return;

			await CommandHandler.Execute(e);
		}
	}
}
