import { CSSProperties } from "react";
import { Subset } from "../../definitions/types";

import { ThemeRole } from "../theming/types";
import { useMemo, useState } from "react";

// Definitions
import { primaryFont } from "../../styleDefinitions/typography";
import { blue } from "@material-ui/core/colors";
import { gray } from "../../definitions/colors";
import { useUITheme } from "../theming";
import { merge } from "lodash";

// Type definitions for working with styles.
type ToggleStateStyleSpec = {
  backgroundColor: CSSProperties["color"];
  labelColor: CSSProperties["color"];
  knobColor: CSSProperties["color"];
  borderColor: CSSProperties["color"];
};

type ToggleStyleSpec = {
  container: React.CSSProperties;
  default: ToggleStateStyleSpec[];
  hover: ToggleStateStyleSpec[];
  disabled: ToggleStateStyleSpec[];
};

type ToggleStyleSpecSubset = Subset<ToggleStyleSpec>;

// Prop definitions.
export type ToggleProps = {
  /** Currently selected option. */
  state: boolean;
  /** Callback to invoke when the toggle is flipped. */
  onToggle: (state: boolean) => void;
  /** Text to render beside the toggle. Optional. */
  label?: string;
  /** Position of label. Optional, defaults to left. */
  labelPosition?: "left" | "right";
  /** Specification on how toggle should be styled. */
  styleOverrides: ToggleStyleSpecSubset;
  /** Primary or secondary. */
  themeRole?: ThemeRole;
  /** Whether the component is currently disabled for user interactions. */
  disabled?: boolean;
  /** Size of toggle. Optional, defaults to medium. */
  size?: "medium" | "small";
};

/** Fully controlled Toggle component. */
export default function Toggle({
  label,
  labelPosition,
  styleOverrides,
  themeRole,
  state,
  onToggle,
  disabled,
  size = "medium",
}: ToggleProps) {
  const theme = useUITheme();
  const [hoverState, setHoverState] = useState<"default" | "hover">("default");

  const styleSpec: ToggleStyleSpec = useMemo(() => {
    const mainColor = theme && themeRole ? theme.palette[themeRole].hue : blue;
    const mainLevel = 400;
    const labelColor = gray[600];
    const disabledColor = gray[300];

    const defaultStyleSpec: ToggleStyleSpec = {
      container: {},
      default: [
        {
          backgroundColor: "none",
          knobColor: mainColor[mainLevel],
          borderColor: mainColor[mainLevel],
          labelColor,
        },
        {
          backgroundColor: mainColor[mainLevel],
          knobColor: "white",
          borderColor: mainColor[mainLevel],
          labelColor,
        },
      ],
      hover: [
        {
          backgroundColor: mainColor[100],
          knobColor: mainColor[mainLevel],
          borderColor: mainColor[mainLevel],
          labelColor,
        },
        {
          backgroundColor: mainColor[mainLevel + 200],
          knobColor: "white",
          borderColor: mainColor[mainLevel + 200],
          labelColor,
        },
      ],
      disabled: [
        {
          backgroundColor: "none",
          knobColor: disabledColor,
          borderColor: disabledColor,
          labelColor,
        },
        {
          backgroundColor: disabledColor,
          knobColor: "white",
          borderColor: disabledColor,
          labelColor,
        },
      ],
    };

    return merge({}, defaultStyleSpec, styleOverrides);
  }, [styleOverrides, theme, themeRole]);

  /**
   * The CSS styles that should be applied can depend
   * on (1) whether or not the component is
   * focused/hovered, (2) which option is selected,
   * and (3) whether the toggle is disabled.
   */
  const currentStyles = useMemo(() => {
    const selectedOptionIndex = state ? 1 : 0;

    return disabled
      ? styleSpec.disabled[selectedOptionIndex]
      : styleSpec[hoverState][selectedOptionIndex]
      ? styleSpec[hoverState][selectedOptionIndex]
      : styleSpec[hoverState][0];
  }, [hoverState, state, styleSpec, disabled]);

  const ariaLabel = useMemo(() => {
    if (label) return label + " Toggle";
    else return "Toggle";
  }, [label]);

  const width = size === "medium" ? 40 : 20;
  const height = width / 2;
  const borderWidth = 2;
  const knobSize = size === "medium" ? 12 : 5;
  const knobOffset = size === "medium" ? 2 : 1;

  return (
    <div
      css={{
        display: "flex",
        alignItems: "center",
        pointerEvents: disabled ? "none" : "auto",
        fontFamily: primaryFont,
        fontSize: 13,
        fontWeight: 400,
        ...styleSpec.container,
      }}
    >
      {label && labelPosition === "left" && (
        <span
          css={{
            marginRight: size === "medium" ? 10 : 5,
            color: currentStyles.labelColor,
          }}
        >
          {label}
        </span>
      )}
      <div
        role="switch"
        aria-label={ariaLabel}
        aria-checked={state}
        css={{
          display: "flex",
          position: "relative",
          boxSizing: "border-box",
          transition: "all ease .33s",
          alignItems: "center",
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: currentStyles.backgroundColor,
          ...(currentStyles.borderColor
            ? {
                borderColor: currentStyles.borderColor,
                borderWidth,
                borderStyle: "solid",
              }
            : {
                border: "none",
              }),
        }}
        onKeyDown={(event) => {
          if (["Space", "Enter"].includes(event.code)) {
            onToggle(!state);
          }
        }}
        onFocus={() => setHoverState("hover")}
        onBlur={() => setHoverState("default")}
        onMouseEnter={() => setHoverState("hover")}
        onMouseLeave={() => setHoverState("default")}
        onClick={() => onToggle(!state)}
        tabIndex={0}
      >
        <div
          css={{
            position: "absolute",
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            left: !state
              ? knobOffset
              : width - knobSize - 2 * borderWidth - knobOffset,
            transition: "ease all .33s",
            backgroundColor: currentStyles.knobColor,
          }}
        />
      </div>
      {label && labelPosition === "right" && (
        <span
          css={{
            marginLeft: size === "medium" ? 10 : 5,
            color: currentStyles.labelColor,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
