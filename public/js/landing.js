changeMe = document.getElementById("response");

setTimeout(async () => {
    let rawResponse = await fetch(
        new URL('api/hello', API_DOMAIN),
            {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
        }
    ).json();
}, 200);
