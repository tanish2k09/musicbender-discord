use crate::commands::test::*;
use serenity::framework::standard::macros::group;

#[group]
#[commands(ping)]
pub struct Test;
