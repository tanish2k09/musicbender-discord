using MongoDB.Bson;
using MongoDB.Driver;
using Musicbender.Data;
using Musicbender.Helpers.Security;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Musicbender.Handlers.Data
{
  class DatabaseHandler
  {
    private static MongoClient dbClient = new MongoClient(CredentialsKeeper.MongoConnection);
    private static IMongoDatabase SelfDB;

    public static void InitDB()
    {
      // Assume database structure is pre-configured
      SelfDB = dbClient.GetDatabase(CredentialsKeeper.SelfDB);
    }

    public static async Task<Effect> GetEffect(ulong ID, string effect)
    {
      var collection = SelfDB.GetCollection<BsonDocument>("effects_" + ID.ToString());

      if (collection == null)
        return null;

      var filter = Builders<BsonDocument>.Filter.Eq("name", effect);
      var firstDocument = await collection.Find(filter).FirstOrDefaultAsync();

      if (firstDocument == null)
        return null;

      return new Effect(effect, firstDocument.GetElement("url").Value.ToString());
    }

    public static async Task<List<string>> ListEffects(ulong ID)
    {
      var collection = SelfDB.GetCollection<BsonDocument>("effects_" + ID.ToString());

      if (collection == null)
        return null;

      var allDocuments = await collection.Find(new BsonDocument()).ToListAsync();

      if (allDocuments == null)
        return null;

      List<string> effects = new List<string>();

      foreach (var document in allDocuments)
      {
        effects.Add(document.GetElement("name").Value.ToString());
      }

      effects.Sort();
      return effects;
    }
  }
}
