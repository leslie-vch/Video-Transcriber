import "./FeedbackMessage.scss";

type Props = {
  type: "warning" | "error";
  children: React.ReactNode;
};

export default function FeedbackMessage({ type, children }: Props) {
  return (
    <div className={`app__message app__message--${type}`}>
      {children}
    </div>
  );
}