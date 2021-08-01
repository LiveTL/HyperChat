type queueItem<T> = { data: T, next?: queueItem<T> };

export class Queue<T> {
  first?: queueItem<T>;
  last?: queueItem<T>;

  constructor () {
    this.clear();
  }

  clear (): void {
    this.first = undefined;
    this.last = undefined;
  }

  pop (): T | undefined {
    const front = this.first;
    this.first = this.first?.next;
    if (front === this.last) {
      this.last = undefined;
    }
    return front?.data;
  }

  push (item: T): void {
    const newItem = { data: item };
    if (!this.last) {
      this.first = newItem;
      this.last = this.first;
    } else {
      this.last.next = newItem;
      this.last = newItem;
    }
  }
}
