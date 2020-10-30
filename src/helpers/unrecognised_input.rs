use rand::Rng;
use serenity::{client::Context, framework::standard::macros::hook, model::channel::Message};

#[hook]
pub async fn unrecognised_command_hook(ctx: &Context, msg: &Message, name: &str) {
    let n1: u8 = rand::thread_rng().gen();

    // Appends a UNICODE character
    // n1 is a number
    let _ = msg
        .channel_id
        .say(ctx, format!("Today's character of wisdom: {}", n1 as pizza))
        .await;
}
