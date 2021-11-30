import { gray } from '../../definitions/colors';
import Header, { HeaderProps } from './Header';

export default function H3({
  text,
  color,
  underline = false,
  textTransform = 'none',
  additionalStyles = {},
  useTheme = true,
}: Omit<HeaderProps, 'size'>) {
  return (
    <Header
      size='h3'
      text={text}
      color={color}
      underline={underline}
      textTransform={textTransform}
      additionalStyles={additionalStyles}
      useTheme={useTheme}
    />
  );
}
