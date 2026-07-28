import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="section-padding py-20 text-center animate-fade-in">
      <h1 className="text-6xl font-serif text-wine-800 mb-4">404</h1>
      <p className="text-wine-400 text-lg mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}
