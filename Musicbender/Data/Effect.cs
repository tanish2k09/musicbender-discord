using System;
using System.Collections.Generic;
using System.Text;

namespace Musicbender.Data
{
  class Effect
  {
    public readonly string Name;
    public readonly string URL;
    public bool skip = false;

    public Effect(string name, string url)
    {
      Name = name;
      URL = url;
    }

    public string Skip(bool value)
    {
      skip = value;

      if (value)
        return "Skipping effect: " + Name;

      return "Keeping effect: " + Name;
    }
  }
}
