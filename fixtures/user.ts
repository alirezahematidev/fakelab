export interface User {
  /**
   * @faker string.ulid
   */
  id: string;
  /**
   * @faker person.fullName
   */
  name: string;
  /**
   * @faker location.streetAddress
   */
  address: string;
  /**
   * @faker phone.number
   */
  phone: string;
  /**
   * @faker number.int({min:10,max:80})
   */
  age: number;
}
