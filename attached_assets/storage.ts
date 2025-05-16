export async function getUserByUsernameInAcademy(username, academyId) {
  return db.user.findFirst({
    where: {
      username,
      academyId
    }
  });
}