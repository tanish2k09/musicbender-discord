use std::fs;

use serde::{Deserialize, Serialize};
use serenity::framework::standard::CommandResult;
use std::io::BufReader;

#[derive(Serialize, Deserialize)]
pub struct Credentials {
    pub token: String,
}

pub fn read_creds(path: String) -> CommandResult<Credentials> {
    let file = fs::File::open(path)?;
    let reader = BufReader::new(file);

    let creds: Credentials = serde_json::from_reader(reader).unwrap();

    Ok(creds)
}
