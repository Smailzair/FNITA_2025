const PgFooter = () => {
  return (
    <footer className="w-full h-[40px] bg-teal-900 text-white flex items-center justify-center text-xs shadow-inner z-10 shrink-0">
      Copyright &copy; {new Date().getFullYear()}. Al Baitar SoftVet
    </footer>
  );
};

export default PgFooter;
