import { fakelab, type Typeof, type Keyof } from "fakelab/runtime";
import { useEffect, useState } from "react";
import "./index.css";

function App() {
  const [users, setUsers] = useState<Typeof<"user">[]>([]);

  useEffect(() => {
    fakelab.fetch("user", { count: 10 }).then(setUsers);
  }, []);

  if (users.length === 0) {
    return (
      <main id="main">
        <h2>Loading...</h2>
      </main>
    );
  }
  const columns = Object.keys(users.reduce((_, curr) => curr)) as Keyof<"user">[];

  return (
    <main id="main">
      <h2>Users List:</h2>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{user[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default App;
