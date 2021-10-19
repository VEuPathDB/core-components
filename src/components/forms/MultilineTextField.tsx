// Components
import { H6 } from '../headers';

// Definitions
import { DARK_GRAY, MEDIUM_GRAY } from '../../constants/colors';
import typography from '../../styleDefinitions/typography';
import useDimensions from 'react-cool-dimensions';
import { useEffect, useState } from 'react';

export type MultilineTextFieldProps = {
  heading: string;
  instructions?: string;
  placeholder?: string;
  width: string | number;
  height: string | number;
  characterLimit?: number;
  onValueChange: (value: string) => void;
};

export default function MultilineTextField({
  heading,
  instructions,
  placeholder,
  width,
  height,
  characterLimit,
  onValueChange,
}: MultilineTextFieldProps) {
  const [value, setValue] = useState('');

  // Invoke passed in change handler when value changes.
  useEffect(() => {
    onValueChange(value);
  }, [value]);

  const {
    observe,
    width: currentWidth,
    height: currentHeight,
  } = useDimensions();

  return (
    <div css={{ width, height }}>
      <div css={{ marginBottom: 5 }}>
        <H6 text={heading} additionalStyles={{ marginBottom: 0 }} />
        {instructions && (
          <label css={[typography.label, { color: DARK_GRAY }]}>
            {instructions}
          </label>
        )}
      </div>
      <div css={{ position: 'relative', height: '100%' }}>
        <textarea
          ref={observe}
          maxLength={characterLimit}
          css={[
            typography.p,
            {
              boxSizing: 'border-box',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'rgb(170, 170, 170)',
              borderRadius: 5,
              padding: 15,
              paddingBottom: 35,
              resize: 'none',
              width,
              height: '100%',
              color: MEDIUM_GRAY,
              ':focus': {
                outlineColor: 'rgb(170, 170, 170)',
                outlineWidth: 1,
                outlineStyle: 'solid',
                color: DARK_GRAY,
              },
            },
          ]}
          placeholder={placeholder}
          value={value}
          onChange={(event: any) => {
            setValue(event.target.value);
          }}
        />
        {characterLimit && currentHeight && (
          <p
            css={[
              typography.metaData,
              { position: 'absolute', top: currentHeight + 20, left: 15 },
            ]}
          >
            {`${value.length} / ${characterLimit}`}
          </p>
        )}
      </div>
    </div>
  );
}
