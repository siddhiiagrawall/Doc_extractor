import React from 'react'

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  )
}

const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`card-title ${className}`} {...props}>
      {children}
    </h3>
  )
}

const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`card-description ${className}`} {...props}>
      {children}
    </p>
  )
}

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-content ${className}`} {...props}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }

