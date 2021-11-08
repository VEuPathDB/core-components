import { GRAY } from '../../definitions/colors';
import Header, { HeaderProps } from './Header';

export default function H6({
  text,
  color = GRAY[600],
  underline = false,
  textTransform = 'none',
  additionalStyles = {},
}: Omit<HeaderProps, 'size'>) {
  return (
    <Header
      size='h6'
      text={text}
      color={color}
      underline={underline}
      textTransform={textTransform}
      additionalStyles={additionalStyles}
    />
  );
}
