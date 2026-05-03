import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="login-screen">
          <section className="login-panel">
            <h1>MediAI</h1>
            <p className="error">
              Erreur d'affichage: {this.state.error.message}. Rechargez la page ou videz le
              stockage local du navigateur.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
