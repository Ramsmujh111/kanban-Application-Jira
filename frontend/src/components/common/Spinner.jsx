const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : '';

  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner ${sizeClass}`} />
    </div>
  );
};

export default Spinner;
