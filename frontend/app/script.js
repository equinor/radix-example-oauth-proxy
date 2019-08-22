document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('triggerFetch');
  btn.addEventListener('click', () => {
    fetch(document.location.origin + '/api/')
      .then(res => {
        res.text().then(body => {
          let output = `
            Response to request for /api/
            =============================
            
            Status
            ------
            
            ${res.status} ${res.statusText}
            
            Headers
            -------

            ${JSON.stringify(
              Array.from(res.headers.entries(), h => `${h[0]}: ${h[1]}`),
              null,
              2
            )}

            Body
            ----

            ${body}
          `;
          document.getElementById('responseOutput').innerText = output;
        })
      })
  })
});