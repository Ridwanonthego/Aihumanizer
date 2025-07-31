import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4">
      <div className="container mx-auto flex items-center justify-center bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_#6366F1]">
        <h1 className="text-2xl md:text-4xl font-bold text-black p-4">
          Humanize Your Document
        </h1>
      </div>
    </header>
  );
};

export default Header;