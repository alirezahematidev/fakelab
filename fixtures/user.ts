export interface User {
  /**
   * @faker string.ulid
   */
  id3: string;
  /**
   * @faker person.fullName
   */
  name: string;
  /**
   * @faker location.streetAddress
   * @faker location.streetAddress
   */
  address: [string, string];
  /**
   * @faker phone.number
   */
  phone: string;
  /**
   * @faker number.int({min:10,max:80})
   */
  age: number;

  /**
   * @faker string.uuid
   */
  tags: string[];

  profile: Profile;
}

export interface Profile {
  name: string;
}
