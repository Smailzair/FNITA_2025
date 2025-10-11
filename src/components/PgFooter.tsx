const PgFooter = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-[40px] bg-teal-900 text-white flex items-center justify-center text-xs shadow-inner z-10">
      Copyright &copy; {new Date().getFullYear()}. Al Baitar SoftVet
    </footer>
  );
};

export default PgFooter;
