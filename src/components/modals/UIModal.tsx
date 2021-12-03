import { CSSProperties, ReactNode, useMemo, useState } from 'react';
import { merge } from 'lodash';
import ReactModal from 'react-modal';

// Components
import { H3 } from '../headers';
import { CloseCircle } from '../icons';

// Definitions
import colors, { blue, gray } from '../../definitions/colors';
import { UITheme } from '../theming/types';

// Hooks
import useUITheme from '../theming/useUITheme';

type UIModalStyleSpec = {
  border: {
    color: CSSProperties['borderColor'];
    width: CSSProperties['borderWidth'];
    radius: CSSProperties['borderRadius'];
    style: CSSProperties['borderStyle'];
  };
  header: {
    primaryBackgroundColor: CSSProperties['backgroundColor'];
    secondaryBackgroundColor: CSSProperties['backgroundColor'];
  };
  content: {
    padding: CSSProperties['padding'];
  };
  size: {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
  };
};

export type UIModalProps = {
  /** Adds a title to the modal. */
  title?: string;
  /** Indicates which theme role to use for style augmentation. */
  themeRole?: keyof UITheme['palette'];
  /**
   * Whether or not to include a default close button in the top
   * right corner of the modal? Defaults to false.
   * */
  includeCloseButton?: boolean;
  /**
   * Optional. If you want the modal to be able to control it's own visibility,
   * you need to pass this prop to it. The prop must be a function that accepts
   * a boolean value and modifies the value being passed into the modal as
   * the `visible` prop.
   */
  toggleVisible?: (visible: boolean) => void;
  /** Controls the visibility of the modal. */
  visible: boolean;
  /** The CSS zIndex level to place the modal on. Defaults to 1000. */
  zIndex?: number;
  /** Function to invoke after modal is opened. */
  onOpen?: () => void;
  /** Function to invoke after modal is closed. */
  onClose?: () => void;
  /** Allows you to adjust the style of the modal. Applied *after* theming augmentation. */
  styleOverrides?: Partial<UIModalStyleSpec>;
  /** The contents of the modal.  */
  children: ReactNode;
};

export default function UIModal({
  title,
  visible,
  toggleVisible,
  includeCloseButton = false,
  zIndex = 1000,
  onOpen,
  onClose,
  themeRole,
  styleOverrides = {},
  children,
}: UIModalProps) {
  const [test, setTest] = useState(false);

  const theme = useUITheme();
  const componentStyle: UIModalStyleSpec = useMemo(() => {
    const defaultStyle: UIModalStyleSpec = {
      border: {
        width: 2,
        style: 'solid',
        color: gray[500],
        radius: 7,
      },
      content: { padding: '0px 50px 0px 25px' },
      header: {
        primaryBackgroundColor: blue[500],
        secondaryBackgroundColor: blue[600],
      },
      size: {
        width: undefined,
        height: undefined,
      },
    };

    // TODO: Handle color problems when level is too dark.
    const themeStyle: Partial<UIModalStyleSpec> =
      theme && themeRole
        ? {
            header: {
              primaryBackgroundColor:
                theme.palette[themeRole].hue[theme.palette.primary.level],
              secondaryBackgroundColor:
                theme.palette[themeRole].hue[theme.palette.primary.level + 100],
            },
          }
        : {};

    return merge({}, defaultStyle, themeStyle, styleOverrides);
  }, [themeRole, styleOverrides, theme]);

  return (
    <ReactModal
      isOpen={visible}
      onAfterOpen={onOpen}
      onAfterClose={onClose}
      // TODO: Come back here and add ability to close on outside click or esc button.
      // onRequestClose={
      //   toggleVisible ? (event) => toggleVisible(!visible) : undefined
      // }
      // NOTE: A future improvement would be to properly account for the warning that is displayed when this value is true.
      ariaHideApp={false}
      style={{
        overlay: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: gray[400],
          zIndex,
        },
        content: {
          position: 'absolute',
          // TODO: Dynamically adjust header height if multiple lines are needed.
          maxWidth: componentStyle.size.width,
          maxHeight: componentStyle.size.height,
          padding: 0,
          margin: 'auto',
          background: colors.white,
          borderRadius: componentStyle.border.radius,
          borderColor: componentStyle.border.color,
          borderWidth: componentStyle.border.width,
          borderStyle: componentStyle.border.style,
        },
      }}
    >
      {title && (
        <div
          css={{
            overflow: 'auto',
            outline: 'none',
            margin: 0,
          }}
        >
          <div
            css={{
              height: 75,
              backgroundColor: componentStyle.header.primaryBackgroundColor,
            }}
          />
          <div
            css={{
              height: 15,
              backgroundColor: componentStyle.header.secondaryBackgroundColor,
            }}
          />
          <div css={{ position: 'absolute', left: 25, top: 38 }}>
            <H3 text={title} color='white' additionalStyles={{ margin: 0 }} />
          </div>
        </div>
      )}
      {includeCloseButton && toggleVisible && (
        <CloseCircle
          fill={title ? 'white' : gray[600]}
          css={{ position: 'absolute', top: 15, right: 15 }}
          fontSize={24}
          onClick={() => toggleVisible(!visible)}
        />
      )}
      <div css={{ padding: '0px 50px 0px 25px' }}>{children}</div>
    </ReactModal>
  );
}
