FROM python:3.13-bookworm

WORKDIR /app

COPY negotiation_agents/requirements.txt /tmp/requirements.txt

RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY negotiation_agents/ /app/

EXPOSE 8000

CMD ["uvicorn", "api_main:app", "--host", "0.0.0.0", "--port", "8000"]
