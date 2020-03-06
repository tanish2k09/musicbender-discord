using System;
using System.Collections.Generic;
using System.Text;

namespace Musicbender.Data
{
  class Effect
  {
    public readonly string Name;
    public readonly string URL;

    public Effect(string name, string url)
    {
      Name = name;
      URL = url;
    }
  }
}
