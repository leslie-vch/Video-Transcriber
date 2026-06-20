import {
    forwardRef,
    type ChangeEventHandler,
    type KeyboardEventHandler,
} from "react";
import "./textInput.scss";

type TextInputProps = Readonly<{
    label?: string;
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
    placeholder?: string;
    type?: "text" | "email" | "password" | "url" | "search";
    disabled?: boolean;
    name?: string;
    id?: string;
}>;

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    function TextInput(
        {
            label,
            value,
            onChange,
            onKeyDown,
            placeholder,
            type = "text",
            disabled = false,
            name,
            id,
        },
        ref
    ) {
        return (
            <div className="textInput">
                {label && (
                    <label className="textInput__label" htmlFor={id}>
                        {label}
                    </label>
                )}

                <input
                    ref={ref}
                    id={id}
                    name={name}
                    className="textInput__field"
                    type={type}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            </div>
        );
    }
);

export default TextInput;