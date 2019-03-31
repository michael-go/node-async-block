const express = require('express');
const crypto = require('crypto');

const PID = process.pid;

function log(msg) {
  console.log(`[${PID}]` ,new Date(), msg);
}

function randomString() {
  return crypto.randomBytes(100).toString('hex');
}

const app = express();
app.get('/healthcheck', function healthcheck(req, res) {
  log('they check my health');
  res.send('all good!\n')
});


app.get('/compute-sync', function computeSync(req, res) {
  log('computing sync!');
  const hash = crypto.createHash('sha256');
  for (let i=0; i < 10e6; i++) {
    hash.update(randomString())
  }
  res.send(hash.digest('hex') + '\n');
});

app.get('/compute-async', async function computeAsync(req, res) {
  log('computing async!');

  const hash = crypto.createHash('sha256');

  const asyncUpdate = async () => hash.update(randomString());

  for (let i = 0; i < 10e6; i++) {
    await asyncUpdate();
  }
  res.send(hash.digest('hex') + '\n');
});

app.get('/compute-with-set-timeout', async function computeWSetTimeout (req, res) {
  log('computing async with setTimeout!');

  function setTimeoutPromise(delay) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), delay);
    });
  }

  const hash = crypto.createHash('sha256');
  for (let i = 0; i < 10e6; i++) {
    hash.update(randomString());
    await setTimeoutPromise(0);
  }
  res.send(hash.digest('hex') + '\n');
});

app.get('/compute-with-set-immediate', async function computeWSetImmediate(req, res) {
  log('computing async with setImmidiate!');

  function setImmediatePromise() {
    return new Promise((resolve) => {
      setImmediate(() => resolve());
    });
  }

  const hash = crypto.createHash('sha256');
  for (let i = 0; i < 10e6; i++) {
    hash.update(randomString());
    await setImmediatePromise()
  }
  res.send(hash.digest('hex') + '\n');
});

app.get('/compute-with-set-immediate-closure', function computeWSetImmediate(req, res) {
    function asyncUpdateHash(n, doneCB) {
        const hash = crypto.createHash('sha256');
        // Update ongoing hash in JS closure.
        function updateHash(i, cb) {
            hash.update(randomString());
            if (i == n) {
                cb(hash);
                return;
            }

            // "Asynchronous recursion".
            // Schedule next operation asynchronously.
            setImmediate(updateHash.bind(null, i+1, cb));
        }

        // Start the helper, with CB to call doneCB.
        updateHash(1, doneCB);
    }

    asyncUpdateHash(10e6, function(hash){
        res.send(hash.digest('hex') + '\n');
    });
});

app.get('/compute-with-next-tick', async function computeWNextTick (req, res) {
  log('computing async with nextTick!');

  function nextTickPromise() {
    return new Promise((resolve) => {
      process.nextTick(() => resolve());
    });
  }

  const hash = crypto.createHash('sha256');
  for (let i = 0; i < 10e6; i++) {
    hash.update(randomString());
    await nextTickPromise()
  }
  res.send(hash.digest('hex') + '\n');
});

const PORT = process.env.PORT || 1337;
let server = app.listen(PORT, () => log('server listening on :' + PORT));
server.setTimeout(5 * 60 * 1000);
