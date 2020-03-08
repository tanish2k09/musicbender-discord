using System.Collections.Generic;

namespace Musicbender.Data
{
  // TODO: Implement all required queue methods
  class EffectQueue
  {
    private Queue<Effect> queue;

    public void AddEffect(Effect effect)
    {
      queue.Enqueue(effect);
    }

    public Effect PopEffect()
    {
      return queue.Dequeue();
    }
  }
}
