mod commands;
mod helpers;

use serenity::{async_trait, framework::StandardFramework, model::gateway::Ready, prelude::*};

use helpers::commands_provider::*;
use helpers::unrecognised_input::*;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    // Set a handler to be called on the `ready` event. This is called when a
    // shard is booted, and a READY payload is sent by Discord. This payload
    // contains data like the current user's guild Ids, current user data,
    // private channels, and more.
    //
    // In this case, just print what the current user's username is.
    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
    }
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let token = helpers::credentials_helper::read_creds(args[1].to_string())
        .unwrap()
        .token;

    let framework = StandardFramework::new()
        .configure(|c| c.prefix("~")) // set the bot's prefix to "~"
        .unrecognised_command(unrecognised_command_hook)
        .group(&TEST_GROUP);

    // Create a new instance of the Client, logging in as a bot. This will
    // automatically prepend your bot token with "Bot ", which is a requirement
    // by Discord for bot users.
    let mut client = Client::new(&token)
        .framework(framework)
        .event_handler(Handler)
        .await
        .expect("Err creating client");

    // Finally, start a single shard, and start listening to events.
    //
    // Shards will automatically attempt to reconnect, and will perform
    // exponential backoff until it reconnects.
    if let Err(why) = client.start().await {
        println!("Client error: {:?}", why);
    }
}
