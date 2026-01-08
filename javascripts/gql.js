/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */

function loadgqlEndpoint() {
  const gql = document.getElementById("gql-script");
  return new Promise((resolve, reject) => {
    if (gql) {
      const address = gql.getAttribute("data-address");
      const prefix = gql.getAttribute("data-prefix");
      resolve(`${address}${prefix}/graphql`);
    } else reject("graphql script failed to load.");
  });
}

async function copyGraphQLEndpoint() {
  if (typeof navigator !== "undefined") {
    const endpoint = await loadgqlEndpoint();
    navigator.clipboard.writeText(endpoint);
  }
}

function copyGraphQLResult() {
  const resultEl = document.getElementById("graphql-result");
  const text = resultEl.textContent || resultEl.innerText;
  if (text && !text.includes("Execute a query")) {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
    }
  }
}

function clearGraphQLResult() {
  const resultEl = document.getElementById("graphql-result");
  resultEl.innerHTML = '<div class="graphql-result-placeholder"><span>Execute a query to see results here</span></div>';
}

async function executeGraphQLQuery() {
  const queryEditor = document.getElementById("graphql-query-editor");
  const resultEl = document.getElementById("graphql-result");
  const query = queryEditor.value.trim();

  if (!query) {
    resultEl.innerHTML = '<div class="graphql-error">Please enter a GraphQL query</div>';
    return;
  }

  resultEl.innerHTML = '<div class="graphql-result-placeholder"><span>Executing query...</span></div>';

  try {
    const endpoint = await loadgqlEndpoint();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    const formatted = JSON.stringify(data, null, 2);

    if (data.errors) {
      resultEl.innerHTML = `<pre class="graphql-error">${formatted}</pre>`;
    } else {
      resultEl.innerHTML = `<pre class="graphql-success">${formatted}</pre>`;
    }
  } catch (error) {
    resultEl.innerHTML = `<pre class="graphql-error">Error: ${error.message}</pre>`;
  }
}
