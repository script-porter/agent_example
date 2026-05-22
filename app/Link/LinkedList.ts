class LinkNode<T> {
  data: T = null!;
  next: LinkNode<T> | null = null;

  constructor(data: T, next: LinkNode<T> | null = null) {
    this.data = data;
    this.next = next;
  }
}

class LinkedList<T> {
  head: LinkNode<T> | null = null;
  size: number = 0;
  constructor() {
    this.head = null;
    this.size = 0;
  }

  [Symbol.iterator]() {
    let current = this.head;
    return {
      next(): IteratorResult<T> {
        if (current) {
          const value = current.data;
          current = current.next;
          return { value: value, done: false };
        } else {
          return { value: null, done: true };
        }
      },
    };
  }

  push(data: T): void;
  push(data: T[]): void;
  push(data: T | T[]): void {
    const set = (value: T) => {
      const node = new LinkNode(value);
      if (!this.head) {
        this.head = node;
      } else {
        let current = this.head;
        while (current.next) {
          current = current.next;
        }
        current.next = node;
      }
      this.size++;
    };

    if (Array.isArray(data)) {
      data.forEach((item) => set(item));
    } else {
      set(data);
    }
  }
}

export { LinkedList, LinkNode };
