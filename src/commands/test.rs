use serenity::{
    client::Context, framework::standard::macros::command, framework::standard::CommandResult,
    model::channel::Message,
};

#[command]
async fn ping(ctx: &Context, msg: &Message) -> CommandResult {
    msg.channel_id.say(ctx, "pong!").await?;

    Ok(())
}
