export interface UserService<User> {
  convertToUserProfile(user: User): any;
}
