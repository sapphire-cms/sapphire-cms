export class Port<Request, Response> {
  private worker: ((req: Request) => Promise<Response>) | null = null;
  private queue: (() => Promise<void>)[] = [];
  private active = 0;

  public constructor(private readonly concurrency: number = 1) {
  }

  public submit(req: Request): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      const task = async () => {
        if (!this.worker) {
          reject(new Error('Worker is not assigned'));
          return;
        }

        try {
          const res = await this.worker(req);
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.active--;
          this.runNext();
        }
      };

      this.queue.push(task);
      this.runNext();
    });
  }

  public accept(worker: (req: Request) => Promise<Response>) {
    if (this.worker) {
      throw new Error('Worker already assigned');
    }
    this.worker = worker;
  }

  private runNext() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.active++;
      task();
    }
  }
}
