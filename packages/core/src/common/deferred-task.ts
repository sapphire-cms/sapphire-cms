import PQueue from 'p-queue';

export class DeferredTask<Request, Response> {
  private worker: ((req: Request) => Promise<Response>) | null = null;
  private readonly queue = new PQueue({ concurrency: 1 });

  public submit(req: Request): Promise<Response> {
    return new Promise<Response>(async resolve => {
      // Wait for submission
      await this.queue.add(async () => {
        if (!this.worker) {
          throw new Error('Worker is not assigned');
        }

        const res = await this.worker!(req);
        resolve(res);
      })
    });
  }

  public accept(worker: (req: Request) => Promise<Response>) {
    if (this.worker) {
      throw new Error('Worker already assigned');
    }
    this.worker = worker;
  }
}
