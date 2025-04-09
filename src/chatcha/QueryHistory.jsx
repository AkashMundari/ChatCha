import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";

const QueryHistoryPage = ({ queryHistory }) => {
  return (
    <Container className="py-4">
      <h2 className="mb-4">Query History</h2>

      <Row xs={1} md={2} lg={3} className="g-4">
        {queryHistory.map((query, index) => (
          <Col key={index}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-primary text-white">
                Query #{index + 1}
              </Card.Header>

              <Card.Body>
                <Card.Title>Input:</Card.Title>
                <Card.Text className="mb-3 text-muted">{query.input}</Card.Text>

                <hr />

                <div className="d-flex flex-column gap-2 mt-3">
                  <div>
                    <span className="fw-bold">CID1:</span>{" "}
                    <a
                      href={`https://ipfs.io/ipfs/${query.cid1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-break"
                    >
                      {query.cid1}
                    </a>
                  </div>

                  <div>
                    <span className="fw-bold">CID2:</span>{" "}
                    <a
                      href={`https://ipfs.io/ipfs/${query.cid2}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-break"
                    >
                      {query.cid2}
                    </a>
                  </div>
                </div>
              </Card.Body>

              <Card.Footer className="text-muted">
                <small>
                  Processed: {new Date(query.timestamp).toLocaleString()}
                </small>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {queryHistory.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">No queries have been processed yet.</p>
        </div>
      )}
    </Container>
  );
};

export default QueryHistoryPage;
