import Header, { HeaderProps } from './Header';

export default function H1({
  text,
  color,
  underline = false,
  textTransform = 'none',
  additionalStyles = {},
  useTheme,
}: Omit<HeaderProps, 'size'>) {
  return (
    <Header
      size='h1'
      text={text}
      color={color}
      underline={underline}
      textTransform={textTransform}
      additionalStyles={additionalStyles}
      useTheme={useTheme}
    />
  );
}
