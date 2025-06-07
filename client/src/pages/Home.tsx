
import { JSX } from "react";

import Container from "../layouts/Container";
import FeedLayout from "../layouts/FeedLayout";

function Home(): JSX.Element {
  return (
    <div>
        <Container>
            <FeedLayout />
        </Container>
    </div>
  )
}

export default Home;