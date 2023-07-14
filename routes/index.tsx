import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>BoardGame</title>
      </Head>
      <div className="px-4 py-5 text-center">
        <img
          src="/logo.svg"
          className="d-block mx-auto mb-4"
          width="256"
          height="256"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <div className="col-lg-4 col-md-5 col-sm-6 mx-auto">
          <h1 className="display-5 fw-bold text-body-emphasis">BoardGame</h1>
          <p className="lead mb-4">
            Join our lobby and enjoy the game together.
          </p>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <input
              type="text"
              className="form-control"
              name="username"
              id="username-input"
              placeholder="Your name..."
            />
            <button type="button" className="btn btn-primary">Join</button>
          </div>
        </div>
      </div>
    </>
  );
}
