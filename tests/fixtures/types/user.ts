export interface User {
  id: string;
  name: string;
  age: number;
  active: boolean;
}

export interface Profile {
  /**
   * @faker string.uuid
   */
  id: string;
  /**
   * @faker number.int({ min:1, max:10 })
   */
  age: number;

  user: User;
}

export interface Product {
  tags: string[];
  status: "active" | "inactive" | "pending";
  value: string | number;
}
